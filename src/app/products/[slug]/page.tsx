import type { Metadata } from "next";
import { notFound } from "next/navigation";
import App from "@/components/App";
import { productById, products } from "@/products";

type Props = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = productById(slug);

  if (!item) return {};

  return {
    title: item.name,
    description: `${item.name}의 가격 변화와 시장 동향`,
  };
}

export default async function FishPage({ params }: Props) {
  const { slug } = await params;
  const item = productById(slug);

  if (!item) notFound();

  return <App />;
}
