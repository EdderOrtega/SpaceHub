import { DetailsScreen } from "@/components/screens/details-screen";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DetailsScreen id={id} />;
}
