import { NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import { Box, Button, Group, Loader, Text } from "@mantine/core";
import { IconDatabase } from "@tabler/icons-react";
import { useParams } from "react-router-dom";
import { usePageQuery } from "@/features/page/queries/page-query.ts";
import { extractPageSlugId } from "@/lib";
import { createDatabase } from "@/features/database/services/database-service";
import DatabaseView from "@/features/database/components/database-view";

export default function DatabaseNodeView(props: NodeViewProps) {
  const { node, updateAttributes, editor } = props;
  const databaseId: string | null = node.attrs.databaseId;
  const editable = editor.isEditable;

  const { pageSlug } = useParams();
  const { data: page } = usePageQuery({
    pageId: extractPageSlugId(pageSlug),
  });

  const [creating, setCreating] = useState(false);
  const creatingRef = useRef(false);

  const create = async () => {
    if (creatingRef.current || !page?.spaceId) return;
    creatingRef.current = true;
    setCreating(true);
    try {
      const db = await createDatabase({ spaceId: page.spaceId, title: "" });
      updateAttributes({ databaseId: db.id });
    } finally {
      setCreating(false);
    }
  };

  // auto-create a backing database the first time an empty block renders
  useEffect(() => {
    if (!databaseId && editable && page?.spaceId && !creatingRef.current) {
      create();
    }
  }, [databaseId, editable, page?.spaceId]);

  return (
    <NodeViewWrapper
      className="database-node"
      contentEditable={false}
      style={{ margin: "0.75rem 0" }}
    >
      {databaseId ? (
        <DatabaseView databaseId={databaseId} />
      ) : (
        <Box
          p="lg"
          style={{
            border: "1px dashed var(--mantine-color-default-border)",
            borderRadius: 8,
          }}
        >
          <Group>
            <IconDatabase size={18} />
            {creating ? (
              <Group gap="xs">
                <Loader size="xs" />
                <Text size="sm" c="dimmed">
                  Creating database…
                </Text>
              </Group>
            ) : editable ? (
              <Button size="xs" variant="light" onClick={create}>
                Create database
              </Button>
            ) : (
              <Text size="sm" c="dimmed">
                Empty database
              </Text>
            )}
          </Group>
        </Box>
      )}
    </NodeViewWrapper>
  );
}
