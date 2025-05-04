
import React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

interface ExpirationDatePickerProps {
  expirationDate: Date | null;
  setExpirationDate: (date: Date | null) => void;
}

const ExpirationDatePicker = ({
  expirationDate,
  setExpirationDate,
}: ExpirationDatePickerProps) => {
  return (
    <div>
      <Label>Expiration Date (optional)</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal mt-1",
              !expirationDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {expirationDate ? format(expirationDate, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={expirationDate}
            onSelect={setExpirationDate}
            disabled={(date) => date < new Date()}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ExpirationDatePicker;
