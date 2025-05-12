import { useQuery } from "@tanstack/react-query";
import { Event } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EventSelectorProps {
  activeEventId: number;
  onEventSelect: (eventId: number) => void;
}

export default function EventSelector({ activeEventId, onEventSelect }: EventSelectorProps) {
  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ['/api/events'],
  });

  if (isLoading || !events || events.length === 0) {
    return null;
  }

  const handleChange = (value: string) => {
    onEventSelect(parseInt(value));
  };

  return (
    <Select value={activeEventId.toString()} onValueChange={handleChange}>
      <SelectTrigger className="w-[250px]">
        <SelectValue placeholder="Select an event" />
      </SelectTrigger>
      <SelectContent>
        {events.map((event) => (
          <SelectItem key={event.id} value={event.id.toString()}>
            {event.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
