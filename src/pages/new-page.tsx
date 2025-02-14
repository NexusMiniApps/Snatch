import React from 'react';
import { trpc } from '~/utils/trpc';
import Button from '~/components/Button';

const NewPage: React.FC = () => {
  const { data, refetch } = trpc.newFeature.exampleProcedure.useQuery(
    { data: 'Hello PartyKit!' },
    { enabled: false }
  );

  return (
    <div>
      <h1>New Page</h1>
      <Button label="Fetch Data" onClick={() => refetch()} />
      {data && <p>{data.message}</p>}
    </div>
  );
};

export default NewPage; 