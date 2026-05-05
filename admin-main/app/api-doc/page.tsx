// app/api-doc/page.tsx
import { notFound } from 'next/navigation';
import { getApiDocs } from '@/lib/swagger';
import ReactSwagger from './react-swagger';

export default async function IndexPage() {
  // STRICT LOCAL ONLY CHECK
  if (process.env.NODE_ENV !== 'development') {
    notFound(); // Returns a standard 404 page in production
  }

  const spec = await getApiDocs();

  return (
    <section className="container mx-auto mt-12 pb-12">
      <ReactSwagger spec={spec} />
    </section>
  );
}