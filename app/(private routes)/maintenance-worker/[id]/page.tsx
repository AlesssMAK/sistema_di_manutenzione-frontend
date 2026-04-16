export default function FaultDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const id = params.id;
  return (
    <div>
      <h2>Dettaglio Intervento{id}</h2>{' '}
    </div>
  );
}
