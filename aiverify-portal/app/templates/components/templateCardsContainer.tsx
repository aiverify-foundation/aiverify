import { fetchTemplates } from '@/lib/fetchApis/getTemplates';
import { TemplateCards } from './templateCards';

type TemplateCardsContainerProps = {
  className?: string;
};

export async function TemplateCardsContainer({
  className,
}: TemplateCardsContainerProps) {
  const response = await fetchTemplates();
  if ('message' in response) {
    throw new Error(response.message);
  }
  const templates = response.data;
  return (
    <section className={className}>
      <TemplateCards templates={templates} />
    </section>
  );
}
