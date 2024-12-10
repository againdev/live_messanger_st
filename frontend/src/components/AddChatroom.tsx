"use client";
import { useMutation, useQuery } from "@apollo/client";
import {
  Button,
  Group,
  Modal,
  MultiSelect,
  Stepper,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconPlus } from "@tabler/icons-react";
import React from "react";
import {
  AddUsersToChatroomMutation,
  AddUsersToChatroomMutationVariables,
  Chatroom,
  CreateChatroomMutation,
  CreateChatroomMutationVariables,
  SearchUsersQuery,
  SearchUsersQueryVariables,
} from "../gql/graphql";
import { ADD_USERS_TO_CHATROOM } from "../graphql/mutations/AddUsersToChatroom";
import { CREATE_CHATROOM } from "../graphql/mutations/CreateChatroom";
import { SEARCH_USERS } from "../graphql/queries/SearchUsers";
import { useGeneralStore } from "../store/generalStore";

export const AddChatroom = () => {
  const [active, setActive] = React.useState(1);
  const [highestStepVisited, setHighestStepVisited] = React.useState(active);

  const isCreateRoomModalOpen = useGeneralStore(
    (state) => state.isCreateRoomModalOpen
  );

  const toggleCreateRoomModal = useGeneralStore(
    (state) => state.toggleCreateRoomModal
  );

  const handleStepChange = (nextStep: number) => {
    const isOutOfBounds = nextStep > 2 || nextStep < 0;

    if (isOutOfBounds) {
      return;
    }

    setActive(nextStep);
    setHighestStepVisited((hSC) => Math.max(hSC, nextStep));
  };

  const [createChatroom, { loading }] = useMutation<
    CreateChatroomMutation,
    CreateChatroomMutationVariables
  >(CREATE_CHATROOM);

  const form = useForm({
    initialValues: {
      name: "",
    },
    validate: {
      name: (value: string) =>
        value.trim().length >= 3 ? null : "Name must be at least 3 characters",
    },
  });

  const [newlyCreatedChatroom, setNewlyCreatedChatroom] =
    React.useState<Chatroom | null>(null);

  const handleCreateChatroom = async () => {
    await createChatroom({
      variables: {
        name: form.values.name,
      },
      onCompleted: (data) => {
        console.log(data);
        setNewlyCreatedChatroom(data.createChatroom);
        handleStepChange(active + 1);
      },
      onError: (error) => {
        form.setErrors({
          name: error.graphQLErrors[0].extensions?.name as string,
        });
      },
      refetchQueries: ["GetChatroomsForUser"],
    });
  };

  const [searchTerm, setSearchTerm] = React.useState("");
  const { data, refetch } = useQuery<
    SearchUsersQuery,
    SearchUsersQueryVariables
  >(SEARCH_USERS, {
    variables: { fullname: searchTerm },
  });
  const [addUsersToChatroom, { loading: loadingUsers }] = useMutation<
    AddUsersToChatroomMutation,
    AddUsersToChatroomMutationVariables
  >(ADD_USERS_TO_CHATROOM, {
    refetchQueries: ["GetChatroomsForUser"],
  });

  const [selectedUsers, setSelectedUsers] = React.useState<string[]>([]);
  const handleAddUsersToChatroom = async () => {
    await addUsersToChatroom({
      variables: {
        chatroomId:
          newlyCreatedChatroom?.id && parseInt(newlyCreatedChatroom?.id),
        userIds: selectedUsers.map((userId) => parseInt(userId)),
      },
      onCompleted: () => {
        handleStepChange(active + 1);
        toggleCreateRoomModal();
        setSelectedUsers([]);
        setNewlyCreatedChatroom(null);
        form.reset();
      },
      onError: (error) => {
        form.setErrors({
          name: error.graphQLErrors[0].extensions?.name as string,
        });
      },
    });
  };

  let debounceTimeout: NodeJS.Timeout;
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);

    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      refetch();
    }, 300);
  };

  type SelectItem = {
    label: string;
    value: string;
  };

  const selectItems: SelectItem[] =
    data?.searchUsers?.map((user) => ({
      label: user.fullname,
      value: String(user.id),
    })) || [];

  return (
    <Modal opened={isCreateRoomModalOpen} onClose={toggleCreateRoomModal}>
      <Stepper active={active} onStepClick={setActive}>
        <Stepper.Step label="First step" description="Create Chatroom">
          <div>Create a Chatroom</div>
        </Stepper.Step>
        <Stepper.Step label="Second step" description="Add members">
          <form onSubmit={form.onSubmit(() => handleCreateChatroom())}>
            <TextInput
              placeholder="Chatroom Name"
              label="Chatroom Name"
              error={form.errors.name}
              {...form.getInputProps("name")}
            />
            <Button mt="md" type="submit">
              Create Room
            </Button>
          </form>
        </Stepper.Step>
        <Stepper.Completed>
          <MultiSelect
            onSearchChange={handleSearchChange}
            nothingFoundMessage="No users found"
            searchable
            pb="xl"
            label="Choose the members you want to add"
            placeholder="Pick all the users you want to add this chatroom"
            onChange={(values) => setSelectedUsers(values)}
          />
        </Stepper.Completed>
      </Stepper>

      <Group mt="xl">
        <Button variant="default" onClick={() => handleStepChange(active - 1)}>
          Back
        </Button>

        {selectedUsers.length > 0 && (
          <Button
            onClick={() => handleAddUsersToChatroom()}
            color="blue"
            leftSection={<IconPlus />}
            loading={loading}
          >
            Add Users
          </Button>
        )}
      </Group>
    </Modal>
  );
};
