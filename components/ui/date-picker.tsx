"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import * as React from "react";

interface TDatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
}

const DatePicker = ({
  value,
  onChange,
  id,
  placeholder,
  disabled,
  minDate,
  maxDate,
}: TDatePickerProps) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          id={id}
          className="w-full justify-between font-normal"
          disabled={disabled}
        >
          {value ? value.toLocaleDateString() : placeholder || "Select date"}
          <CalendarIcon className="size-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0" align="end">
        <Calendar
          mode="single"
          selected={value}
          captionLayout="dropdown"
          fromDate={minDate}
          toDate={maxDate}
          disabled={(date) => {
            if (minDate && date < minDate) {
              return true;
            }
            if (maxDate && date > maxDate) {
              return true;
            }
            return false;
          }}
          onSelect={(date) => {
            onChange?.(date);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
};

export { DatePicker };
