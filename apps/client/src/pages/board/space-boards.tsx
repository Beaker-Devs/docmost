import { Container } from "@mantine/core";
import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useGetSpaceBySlugQuery } from "@/features/space/queries/space-query";
import { getAppName } from "@/lib/config";
import { BoardGrid } from "@/features/board/components/board-grid";
import { useSpaceAbility } from "@/features/space/permissions/use-space-ability";
import {
  SpaceCaslAction,
  SpaceCaslSubject,
} from "@/features/space/permissions/permissions.type";

export default function SpaceBoards() {
  const { spaceSlug } = useParams();
  const { data: space } = useGetSpaceBySlugQuery(spaceSlug);
  const spaceAbility = useSpaceAbility(space?.membership?.permissions);

  return (
    <>
      <Helmet>
        <title>
          Boards - {space?.name || ""} - {getAppName()}
        </title>
      </Helmet>
      <Container size="1000" pt="xl">
        {space && (
          <BoardGrid
            spaceId={space.id}
            spaceSlug={spaceSlug}
            canCreate={spaceAbility.can(
              SpaceCaslAction.Manage,
              SpaceCaslSubject.Page,
            )}
          />
        )}
      </Container>
    </>
  );
}
