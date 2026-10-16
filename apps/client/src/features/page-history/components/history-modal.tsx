import { useEffect, useState } from "react";
import { Modal, Tabs, Text } from "@mantine/core";
import { IconClock, IconHistory } from "@tabler/icons-react";
import { useAtom } from "jotai";
import { historyAtoms } from "@/features/page-history/atoms/history-atoms";
import HistoryModalBody from "@/features/page-history/components/history-modal-body";
import PageActivityPanel from "@/features/audit/components/page-activity-panel";
import { useTranslation } from "react-i18next";

interface Props {
  pageId: string;
}
export default function HistoryModal({ pageId }: Props) {
  const { t } = useTranslation();
  const [isModalOpen, setModalOpen] = useAtom(historyAtoms);
  const [activeTab, setActiveTab] = useState<string | null>("versions");

  // always land on the versions tab when (re)opening
  useEffect(() => {
    if (isModalOpen) {
      setActiveTab("versions");
    }
  }, [isModalOpen]);

  return (
    <>
      <Modal.Root
        size={1200}
        opened={isModalOpen}
        onClose={() => setModalOpen(false)}
      >
        <Modal.Overlay />
        <Modal.Content style={{ overflow: "hidden" }}>
          <Modal.Header>
            <Modal.Title>
              <Text size="md" fw={500}>
                {t("Version history")}
              </Text>
            </Modal.Title>
            <Modal.CloseButton />
          </Modal.Header>
          <Modal.Body>
            <Tabs value={activeTab} onChange={setActiveTab} keepMounted={false}>
              <Tabs.List mb="sm">
                <Tabs.Tab
                  value="versions"
                  leftSection={<IconHistory size={16} />}
                >
                  {t("Versions")}
                </Tabs.Tab>
                <Tabs.Tab value="activity" leftSection={<IconClock size={16} />}>
                  {t("Activity")}
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="versions">
                <HistoryModalBody pageId={pageId} />
              </Tabs.Panel>

              <Tabs.Panel value="activity">
                <PageActivityPanel
                  pageId={pageId}
                  active={activeTab === "activity"}
                />
              </Tabs.Panel>
            </Tabs>
          </Modal.Body>
        </Modal.Content>
      </Modal.Root>
    </>
  );
}
