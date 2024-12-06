"use client";

import React from "react";
import styles from "./Sidebar.module.css";
import { useMutation } from "@apollo/client";
import {
  IconBrandMessenger,
  IconBrandWechat,
  IconLogin,
  IconLogout,
  IconUser,
} from "@tabler/icons-react";
import classNames from "classnames";
import { Center, Stack, Tooltip, UnstyledButton } from "@mantine/core";
import {
  LogoutUserMutation,
  LogoutUserMutationVariables,
} from "../gql/graphql";
import { LOGOUT_USER } from "../graphql/mutations/Logout";
import { useGeneralStore } from "../store/generalStore";
import { useUserStore } from "../store/userStore";

interface Props {
  className?: string;
}

interface NavbarLinkProps {
  icon: React.FC<any>;
  label: string;
  active?: boolean;
  onClick?(): void;
}

const NavbarLink: React.FC<NavbarLinkProps> = ({
  icon: Icon,
  label,
  active,
  onClick,
}) => {
  return (
    <Tooltip label={label} position="right" transitionProps={{ duration: 0 }}>
      <UnstyledButton
        onClick={onClick}
        className={classNames(styles.link, { [styles.active]: active })}
      >
        <Icon size="1.2rem" stroke={1.5} />
      </UnstyledButton>
    </Tooltip>
  );
};

const mockData = [{ icon: IconBrandWechat, label: "Chatrooms" }];

export const Sidebar: React.FC<Props> = ({ className }) => {
  const toggleProfileSettingsModal = useGeneralStore(
    (state) => state.toggleProfileSettingsModal
  );
  const [active, setActive] = React.useState(0);

  const links = mockData.map((link, index) => (
    <NavbarLink
      {...link}
      key={link.label}
      active={index === active}
      onClick={() => setActive(index)}
    />
  ));

  const userId = useUserStore((state) => state.id);
  const user = useUserStore((state) => state);
  const setUser = useUserStore((state) => state.setUser);

  const toggleLoginModal = useGeneralStore((state) => state.toggleLoginModal);

  const [logoutUser, { loading, error }] = useMutation<
    LogoutUserMutation,
    LogoutUserMutationVariables
  >(LOGOUT_USER, {
    onCompleted: () => {
      toggleLoginModal();
    },
  });

  const handleLogout = async () => {
    await logoutUser();
    setUser({
      id: undefined,
      fullname: "",
      avatarUrl: null,
      email: "",
    });
  };

  return (
    <nav className={styles.navbar}>
      <Center>
        <IconBrandMessenger type="mark" size={30} />
      </Center>

      <div className={styles.navbarMain}>
        <Stack justify="center" gap={0}>
          {userId && links}
        </Stack>
      </div>

      <Stack justify="center" gap={0}>
        {userId && (
          <NavbarLink
            icon={IconUser}
            label={"Profile(" + user.fullname + ")"}
            onClick={toggleProfileSettingsModal}
          />
        )}

        {userId ? (
          <NavbarLink icon={IconLogout} label="Logout" onClick={handleLogout} />
        ) : (
          <NavbarLink
            icon={IconLogin}
            label="Login"
            onClick={toggleLoginModal}
          />
        )}
      </Stack>
    </nav>
  );
};
