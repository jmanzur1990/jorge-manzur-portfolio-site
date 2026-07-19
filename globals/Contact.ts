import type { GlobalConfig } from "payload";

export const Contact: GlobalConfig = {
  slug: "contact",
  fields: [
    {
      name: "email",
      type: "email",
    },
    {
      name: "phone",
      type: "text",
    },
    {
      name: "socials",
      type: "array",
      fields: [
        {
          name: "label",
          type: "text",
          required: true,
        },
        {
          name: "handle",
          type: "text",
          required: true,
        },
      ],
    },
  ],
};
