
import React from "react";
import { Button } from "@/components/ui/button";

interface LinkFormSubmitProps {
  isLoading: boolean;
}

const LinkFormSubmit = ({ isLoading }: LinkFormSubmitProps) => {
  return (
    <Button type="submit" disabled={isLoading} className="mt-2">
      {isLoading ? "Creating..." : "Create Link"}
    </Button>
  );
};

export default LinkFormSubmit;
