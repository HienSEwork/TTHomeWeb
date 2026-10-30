import type { Metadata } from "next";
import { Container } from "@tthome/ui";
import { FavoritesList } from "@/components/favorites-list";
import { getServerI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerI18n();
  return { title: t.favorites.title, robots: { index: false } };
}

export default async function FavoritesPage() {
  const { t } = await getServerI18n();
  return (
    <Container className="py-8 sm:py-12">
      <h1 className="text-title font-extrabold text-ink">{t.favorites.title}</h1>
      <p className="mt-1 text-sm text-muted">{t.favorites.lead}</p>
      <FavoritesList className="mt-8" />
    </Container>
  );
}
