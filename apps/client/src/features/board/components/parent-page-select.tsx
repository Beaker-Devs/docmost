import { useMemo, useState } from "react";
import { Select } from "@mantine/core";
import { useDebouncedValue } from "@mantine/hooks";
import { useQuery } from "@tanstack/react-query";
import { searchPage } from "@/features/search/services/search-service";

interface ParentPageSelectProps {
  spaceId: string;
  value: string | null;
  onChange: (pageId: string | null) => void;
  label?: string;
}

/**
 * Async searchable picker for a parent page within a single space.
 * Empty selection means the page is created at the space root.
 */
export function ParentPageSelect({
  spaceId,
  value,
  onChange,
  label = "Location",
}: ParentPageSelectProps) {
  const [search, setSearch] = useState("");
  const [debounced] = useDebouncedValue(search, 300);
  const [selected, setSelected] = useState<{ value: string; label: string } | null>(
    null,
  );

  const { data, isFetching } = useQuery({
    queryKey: ["board-parent-search", spaceId, debounced],
    queryFn: () => searchPage({ query: debounced, spaceId }),
    enabled: !!spaceId && debounced.trim().length > 0,
  });

  const options = useMemo(() => {
    const results = (data ?? []).map((p) => ({
      value: p.id,
      label: p.title?.trim() || "Untitled",
    }));
    // keep the currently selected option visible even when it's not in results
    if (selected && !results.some((o) => o.value === selected.value)) {
      results.unshift(selected);
    }
    return results;
  }, [data, selected]);

  return (
    <Select
      label={label}
      placeholder="Space root"
      description="Search a page to file this card's page under"
      data={options}
      value={value}
      searchable
      clearable
      searchValue={search}
      onSearchChange={setSearch}
      nothingFoundMessage={
        debounced.trim().length === 0
          ? "Type to search pages"
          : isFetching
            ? "Searching…"
            : "No pages found"
      }
      onChange={(val) => {
        const opt = options.find((o) => o.value === val) ?? null;
        setSelected(opt);
        onChange(val);
      }}
      comboboxProps={{ withinPortal: true }}
    />
  );
}
