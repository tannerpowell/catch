import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Catch Studio",
  description: "Content management studio for The Catch",
  robots: {
    index: false,
    follow: false,
  },
};

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
