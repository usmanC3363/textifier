// src/pages/DocumentPage.tsx
import { useParams } from 'react-router-dom';

export default function DocumentPage() {
  const { id } = useParams();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Document</h1>
      <p className="text-gray-500">Document ID: {id}</p>
    </div>
  );
}
