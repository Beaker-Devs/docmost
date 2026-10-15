import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ActionIcon,
  Box,
  Button,
  Divider,
  Drawer,
  Group,
  Loader,
  Menu,
  SegmentedControl,
  Stack,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import {
  IconDots,
  IconExternalLink,
  IconFilePlus,
  IconTrash,
} from "@tabler/icons-react";
import { modals } from "@mantine/modals";
import { ICard } from "@/features/board/types/board.types";
import {
  useCreateCardPageMutation,
  useDeleteCardMutation,
  useUpdateCardMutation,
} from "@/features/board/queries/board-query";
import { usePageQuery } from "@/features/page/queries/page-query";
import PageEditor from "@/features/editor/page-editor";
import { buildPageUrl } from "@/features/page/page.utils";
import { ParentPageSelect } from "./parent-page-select";
import classes from "./board.module.css";

interface CardDrawerProps {
  cardId: string | null;
  card: ICard | null;
  boardId: string;
  spaceId: string;
  spaceSlug: string;
  readOnly?: boolean;
  onClose: () => void;
}

export function CardDrawer({
  cardId,
  card,
  boardId,
  spaceId,
  spaceSlug,
  readOnly,
  onClose,
}: CardDrawerProps) {
  const opened = !!cardId;
  const updateCard = useUpdateCardMutation(boardId);
  const deleteCard = useDeleteCardMutation(boardId);
  const createCardPage = useCreateCardPageMutation(boardId);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [parentPageId, setParentPageId] = useState<string | null>(null);
  const [locationMode, setLocationMode] = useState<"existing" | "new">(
    "existing",
  );
  const [newFolderName, setNewFolderName] = useState("");

  useEffect(() => {
    setTitle(card?.title ?? "");
    setDescription(card?.description ?? "");
    setParentPageId(null);
    setLocationMode("existing");
    setNewFolderName("");
  }, [card?.id]);

  function handleAddPage() {
    if (!card) return;
    if (locationMode === "new" && !newFolderName.trim()) return;
    createCardPage.mutate({
      cardId: card.id,
      parentPageId: parentPageId ?? undefined,
      newParentTitle:
        locationMode === "new" ? newFolderName.trim() : undefined,
    });
  }

  const { data: page, isLoading: pageLoading } = usePageQuery({
    pageId: card?.pageId ?? undefined,
  });

  function saveTitle() {
    if (!card) return;
    const value = title.trim();
    if (value && value !== card.title) {
      updateCard.mutate({ cardId: card.id, title: value });
    }
  }

  function saveDescription() {
    if (!card) return;
    if (description !== (card.description ?? "")) {
      updateCard.mutate({ cardId: card.id, description });
    }
  }

  function confirmDelete() {
    if (!card) return;
    modals.openConfirmModal({
      title: "Delete card",
      children: <Text size="sm">This card will be permanently deleted.</Text>,
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        deleteCard.mutate(card.id);
        onClose();
      },
    });
  }

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size={760}
      padding="lg"
      withCloseButton={false}
    >
      {card && (
        <>
          <Group justify="space-between" mb="sm">
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
              Card
            </Text>
            {!readOnly && (
              <Menu position="bottom-end" withArrow shadow="md">
                <Menu.Target>
                  <ActionIcon variant="subtle" color="gray">
                    <IconDots size={18} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    color="red"
                    leftSection={<IconTrash size={14} />}
                    onClick={confirmDelete}
                  >
                    Delete card
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            )}
          </Group>

          <TextInput
            variant="unstyled"
            size="lg"
            placeholder="Card title"
            value={title}
            readOnly={readOnly}
            onChange={(e) => setTitle(e.currentTarget.value)}
            onBlur={saveTitle}
            classNames={{ input: classes.drawerTitle }}
          />

          <Textarea
            mt="xs"
            variant="filled"
            autosize
            minRows={2}
            placeholder="Add a short description…"
            value={description}
            readOnly={readOnly}
            onChange={(e) => setDescription(e.currentTarget.value)}
            onBlur={saveDescription}
          />

          <Divider my="md" label="Page" labelPosition="left" />

          {card.pageId ? (
            <Box>
              <Group justify="flex-end" mb="xs">
                {page && (
                  <Button
                    component={Link}
                    to={buildPageUrl(
                      page.space?.slug ?? spaceSlug,
                      page.slugId,
                      page.title,
                    )}
                    variant="subtle"
                    size="xs"
                    leftSection={<IconExternalLink size={14} />}
                  >
                    Open full page
                  </Button>
                )}
              </Group>
              {pageLoading || !page ? (
                <Group justify="center" my="xl">
                  <Loader size="sm" />
                </Group>
              ) : (
                <div className={classes.drawerEditor}>
                  <PageEditor
                    key={page.id}
                    pageId={page.id}
                    content={page.content}
                    editable={!readOnly}
                  />
                </div>
              )}
            </Box>
          ) : (
            <Box py="sm">
              <Stack gap="sm">
                <SegmentedControl
                  fullWidth
                  size="xs"
                  value={locationMode}
                  onChange={(v) => setLocationMode(v as "existing" | "new")}
                  data={[
                    { label: "Existing page", value: "existing" },
                    { label: "New folder", value: "new" },
                  ]}
                />

                {locationMode === "new" && (
                  <TextInput
                    label="New folder name"
                    placeholder="e.g. Roadmap cards"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.currentTarget.value)}
                  />
                )}

                <ParentPageSelect
                  spaceId={spaceId}
                  value={parentPageId}
                  onChange={setParentPageId}
                  label={
                    locationMode === "new"
                      ? "Create folder inside (optional)"
                      : "Location"
                  }
                />
              </Stack>

              <Group justify="center" mt="md">
                <Button
                  variant="light"
                  leftSection={<IconFilePlus size={16} />}
                  loading={createCardPage.isPending}
                  disabled={
                    readOnly ||
                    (locationMode === "new" && !newFolderName.trim())
                  }
                  onClick={handleAddPage}
                >
                  Add page content
                </Button>
              </Group>
            </Box>
          )}
        </>
      )}
    </Drawer>
  );
}
