/** The key a heart is saved under: "room:<id>" or "project:<id>". Plain, so server-rendered cards can use it. */
export const favoriteKey = (kind: "room" | "project", id: string) => `${kind}:${id}`;
