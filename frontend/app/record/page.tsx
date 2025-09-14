import RecordGate from "./RecordGate";
import { createConversation } from "./actions";

export default async function RecordPage() {
  const { id, url } = await createConversation();
  return <RecordGate initialId={id} inviteUrl={url} />;
}
