"use client";
import {
  Button,
  Center,
  Grid,
  Group,
  Modal,
  Paper,
  Text,
  TextInput,
} from "@mantine/core";
import React from "react";
import { useGeneralStore } from "../store/generalStore";
import { useForm } from "@mantine/form";
import { useUserStore } from "../store/userStore";
import { GraphQLErrorExtensions } from "graphql";
import { useMutation } from "@apollo/client";
import { REGISTER_USER } from "../graphql/mutations/Register";
import {
  LoginUserMutation,
  LoginUserMutationVariables,
  RegisterUserMutation,
  RegisterUserMutationVariables,
} from "../gql/graphql";
import { LOGIN_USER } from "../graphql/mutations/Login";

interface Props {
  className?: string;
}

export const AuthOverlay: React.FC<Props> = ({ className }) => {
  const isLoginModalOpen = useGeneralStore((state) => state.isLoginModalOpen);
  const toggleLoginModal = useGeneralStore((state) => state.toggleLoginModal);

  const [isRegister, setIsRegister] = React.useState(false);
  const toggleForm = () => {
    setIsRegister(!isRegister);
  };

  const Register = () => {
    const form = useForm({
      initialValues: {
        fullname: "",
        email: "",
        password: "",
        confirmPassword: "",
      },
      validate: {
        fullname: (value: string) =>
          value.trim().length >= 3
            ? null
            : "Username must be at least 3 characters",
        email: (value: string) =>
          value.includes("@") ? null : "Invalid email",
        password: (value: string) =>
          value.trim().length >= 3
            ? null
            : "Password must be at least 3 characters",
        confirmPassword: (value: string, values) =>
          value.trim().length >= 3 && value === values.password
            ? null
            : "Passwords do not match",
      },
    });

    const setUser = useUserStore((state) => state.setUser);
    const setIsLoginOpen = useGeneralStore((state) => state.toggleLoginModal);

    const [errors, setErrors] = React.useState<GraphQLErrorExtensions>({});

    const [registerUser, { loading }] = useMutation<
      RegisterUserMutation,
      RegisterUserMutationVariables
    >(REGISTER_USER);

    const handleRegister = async () => {
      setErrors({});

      await registerUser({
        variables: {
          email: form.values.email,
          password: form.values.password,
          fullname: form.values.fullname,
          confirmPassword: form.values.confirmPassword,
        },
        onCompleted: (data) => {
          setErrors({});
          if (data?.register.user)
            setUser({
              id: data?.register.user.id,
              email: data?.register.user.email,
              fullname: data?.register.user.fullname,
            });
          setIsLoginOpen();
        },
      }).catch((err) => {
        console.log(err.graphQLErrors, "ERROR");
        setErrors(err.graphQLErrors[0].extensions);
        useGeneralStore.setState({ isLoginModalOpen: true });
      });
    };

    return (
      <Paper>
        <Center>
          <Text size="xl">Register</Text>
        </Center>

        <form
          onSubmit={form.onSubmit(() => {
            handleRegister();
          })}
        >
          <Grid mt={20}>
            <Grid.Col span={12}>
              <TextInput
                label="Fullname"
                placeholder="Choose a full name"
                {...form.getInputProps("fullname")}
                error={form.errors.fullname || (errors?.fullname as string)}
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <TextInput
                autoComplete="off"
                label="Email"
                type="email"
                placeholder="Enter your email"
                {...form.getInputProps("email")}
                error={form.errors.email || (errors?.email as string)}
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <TextInput
                autoComplete="off"
                label="Password"
                type="password"
                placeholder="password"
                {...form.getInputProps("password")}
                error={form.errors.password || (errors?.password as string)}
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <TextInput
                autoComplete="off"
                label="Confirm password"
                type="password"
                placeholder="Confirm your password"
                {...form.getInputProps("confirmPassword")}
                error={
                  form.errors.confirmPassword ||
                  (errors?.confirmPassword as string)
                }
              />
            </Grid.Col>

            <Grid.Col span={12}>
              <Button variant="transparent" onClick={toggleForm} pl={0}>
                Already registered? Login here
              </Button>
            </Grid.Col>
          </Grid>

          <Group left={0} mt={20}>
            <Button
              variant="outline"
              color="blue"
              type="submit"
              disabled={loading}
            >
              Register
            </Button>
            <Button variant="outline" color="red">
              Cancel
            </Button>
          </Group>
        </form>
      </Paper>
    );
  };

  const Login = () => {
    const [loginUser, { loading, error, data }] = useMutation<
      LoginUserMutation,
      LoginUserMutationVariables
    >(LOGIN_USER);
    const setUser = useUserStore((state) => state.setUser);
    const setIsLoginOpen = useGeneralStore((state) => state.toggleLoginModal);

    const [errors, setErrors] = React.useState<GraphQLErrorExtensions>({});
    const [invalidCredentials, setInvalidCredentials] = React.useState("");

    const form = useForm({
      initialValues: {
        email: "",
        password: "",
      },
      validate: {
        email: (value: string) =>
          value.includes("@") ? null : "Invalid email",
        password: (value: string) =>
          value.trim().length >= 3
            ? null
            : "Password must be at least 3 characters",
      },
    });

    const handleLogin = async () => {
      await loginUser({
        variables: {
          email: form.values.email,
          password: form.values.password,
        },
        onCompleted: (data) => {
          setErrors({});
          if (data?.login.user) {
            setUser({
              id: data?.login.user.id,
              email: data?.login.user.email,
              fullname: data?.login.user.fullname,
              avatarUrl: data?.login.user.avatarUrl,
            });
            setIsLoginOpen();
          }
        },
      }).catch((err) => {
        setErrors(err.graphQLErrors[0].extensions);
        if (err.graphQLErrors[0].extensions?.invalidCredentials)
          setInvalidCredentials(
            err.graphQLErrors[0].extensions.invalidCredentials
          );
        useGeneralStore.setState({ isLoginModalOpen: true });
      });
    };

    return (
      <Paper>
        <Center>
          <Text size="xl">Login</Text>
        </Center>

        <form
          onSubmit={form.onSubmit(() => {
            handleLogin();
          })}
        >
          <Grid style={{ marginTop: 20 }}>
            <Grid.Col span={12}>
              <TextInput
                autoComplete="off"
                label="Email"
                placeholder="Enter your email"
                {...form.getInputProps("email")}
                error={form.errors.email || (errors?.email as string)}
              />
            </Grid.Col>
            <Grid.Col span={12}>
              <TextInput
                autoComplete="off"
                label="Password"
                type="password"
                placeholder="Enter your password"
                {...form.getInputProps("password")}
                error={form.errors.password || (errors?.password as string)}
              />
            </Grid.Col>
            {/* Not registered yet? then render register component. use something like a text, not a button */}
            <Grid.Col span={12}>
              <Text color="red">{invalidCredentials}</Text>
            </Grid.Col>
            <Grid.Col span={12}>
              <Button pl={0} variant="transparent" onClick={toggleForm}>
                Not registered yet? Register here
              </Button>
            </Grid.Col>
          </Grid>
          {/* buttons: login or cancel */}
          <Group left={0} style={{ marginTop: 20 }}>
            <Button
              variant="outline"
              color="blue"
              type="submit"
              disabled={loading}
            >
              Login
            </Button>
            <Button variant="outline" color="red" onClick={toggleLoginModal}>
              Cancel
            </Button>
          </Group>
        </form>
      </Paper>
    );
  };

  return (
    <Modal centered opened={isLoginModalOpen} onClose={toggleLoginModal}>
      {isRegister ? <Register /> : <Login />}
    </Modal>
  );
};
