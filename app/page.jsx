import { notFound } from "next/navigation";

// The bare domain gives nothing away. Portals live at /p/<slug>.
export default function Home() {
  notFound();
}
