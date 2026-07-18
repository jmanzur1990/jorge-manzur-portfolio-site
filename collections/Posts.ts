import type { CollectionConfig } from "payload";
import { slugFieldHook, validatePositiveNumber } from "./shared";

export const Posts: CollectionConfig = {
  slug: "posts",
  admin: {
    defaultColumns: ["title", "date", "kicker"],
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
      name: "date",
      type: "date",
      required: true,
      admin: {
        date: {
          pickerAppearance: "dayOnly",
        },
      },
    },
    {
      name: "kicker",
      type: "text",
      required: true,
    },
    {
      name: "excerpt",
      type: "textarea",
      required: true,
    },
    {
      name: "readMin",
      type: "number",
      required: true,
      validate: validatePositiveNumber,
    },
    {
      name: "body",
      type: "richText",
      required: true,
    },
  ],
};
