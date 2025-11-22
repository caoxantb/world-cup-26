export default async function Gameplay({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  console.log(id);

  return <div>This is a test </div>;
}
