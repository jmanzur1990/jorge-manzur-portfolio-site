import type { CollectionConfig } from "payload";
import {
  slugFieldHook,
  validateHttpsUrl,
  validateNonEmptyStack,
  validateYear,
} from "./shared";

export const Projects: CollectionConfig = {
  slug: "projects",
  admin: {
    defaultColumns: ["title", "year", "order"],
    useAsTitle: "title",
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: {
        position: "sidebar",
      },
      hooks: {
        beforeValidate: [slugFieldHook],
      },
    },
    {
      name: "order",
      type: "number",
      required: true,
      admin: {
        description: "Use spaced values like 10, 20, 30 so projects can be reordered later.",
      },
    },
    {
      name: "year",
      type: "text",
      required: true,
      validate: validateYear,
    },
    {
      name: "tag",
      type: "text",
      required: true,
    },
    {
      name: "blurb",
      type: "textarea",
      required: true,
    },
    {
      name: "stack",
      type: "array",
      required: true,
      validate: validateNonEmptyStack,
      fields: [
        {
          name: "value",
          type: "text",
          required: true,
        },
      ],
    },
    {
      name: "color",
      type: "select",
      required: true,
      options: [
        { label: "Pink", value: "pink" },
        { label: "Cyan", value: "cyan" },
        { label: "Yellow", value: "yellow" },
      ],
    },
    {
      name: "liveUrl",
      type: "text",
      required: true,
      validate: validateHttpsUrl,
    },
    {
      name: "repoUrl",
      type: "text",
      required: true,
      validate: validateHttpsUrl,
    },
    {
      name: "coverImage",
      type: "upload",
      relationTo: "media",
      required: false,
    },
  ],
};
