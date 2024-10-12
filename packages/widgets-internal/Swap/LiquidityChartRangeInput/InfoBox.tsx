import { ReactNode } from "react";

import { ColumnCenter, Text } from '@plexswap/ui-plex';

export function InfoBox({ message, icon }: { message?: ReactNode; icon: ReactNode }) {
  return (
    <ColumnCenter style={{ height: "100%", justifyContent: "center" }}>
      {icon}
      {message && (
        <Text pt="4px" textAlign="center" fontSize="20px" bold>
          {message}
        </Text>
      )}
    </ColumnCenter>
  );
}
