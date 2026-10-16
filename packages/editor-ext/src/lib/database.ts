import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

export interface DatabaseOptions {
  HTMLAttributes: Record<string, any>;
  view: any;
}

export interface DatabaseAttributes {
  databaseId?: string | null;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    database: {
      setDatabase: (attributes?: DatabaseAttributes) => ReturnType;
    };
  }
}

export const DatabaseNode = Node.create<DatabaseOptions>({
  name: "database",
  group: "block",
  atom: true,
  isolating: true,
  defining: true,
  draggable: true,
  selectable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
      view: null,
    };
  },

  addAttributes() {
    return {
      databaseId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-database-id"),
        renderHTML: (attributes: DatabaseAttributes) => ({
          "data-database-id": attributes.databaseId,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: `div[data-type="${this.name}"]` }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(
        { "data-type": this.name },
        this.options.HTMLAttributes,
        HTMLAttributes,
      ),
    ];
  },

  addCommands() {
    return {
      setDatabase:
        (attrs: DatabaseAttributes = {}) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(this.options.view);
  },
});
