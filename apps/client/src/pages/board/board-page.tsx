import { Anchor, Breadcrumbs, Group, Title } from "@mantine/core";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { IconChevronLeft } from "@tabler/icons-react";
import { useGetSpaceBySlugQuery } from "@/features/space/queries/space-query";
import { getAppName, getSpaceUrl } from "@/lib/config";
import { BoardView } from "@/features/board/components/board-view";
import { useBoardQuery } from "@/features/board/queries/board-query";
import { useSpaceAbility } from "@/features/space/permissions/use-space-ability";
import {
  SpaceCaslAction,
  SpaceCaslSubject,
} from "@/features/space/permissions/permissions.type";

export default function BoardPage() {
  const { spaceSlug, boardId } = useParams();
  const { data: space } = useGetSpaceBySlugQuery(spaceSlug);
  const { data: board } = useBoardQuery(boardId);
  const spaceAbility = useSpaceAbility(space?.membership?.permissions);
  const readOnly = spaceAbility.cannot(
    SpaceCaslAction.Edit,
    SpaceCaslSubject.Page,
  );

  return (
    <>
      <Helmet>
        <title>
          {board?.title || "Board"} - {getAppName()}
        </title>
      </Helmet>

      <Group px="md" pt="sm" gap="sm">
        <Breadcrumbs separator="/">
          <Anchor
            component={Link}
            to={`${getSpaceUrl(spaceSlug)}/boards`}
            c="dimmed"
            size="sm"
          >
            <Group gap={4}>
              <IconChevronLeft size={14} />
              Boards
            </Group>
          </Anchor>
          <Title order={4}>{board?.title}</Title>
        </Breadcrumbs>
      </Group>

      {boardId && (
        <BoardView
          boardId={boardId}
          spaceSlug={spaceSlug}
          readOnly={readOnly}
        />
      )}
    </>
  );
}
