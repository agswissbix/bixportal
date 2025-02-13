import React, { useMemo } from 'react';

// INTERFACCIA PROPS
interface PropsInterface {
  propExampleValue?: string;
}

export default function ExampleComponent({ propExampleValue }: PropsInterface) {
  return (
    <div>
        Contenuto di esempio
    </div>
  );
};


