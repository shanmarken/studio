import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  name: string;
  className?: string;
};

export function UserAvatar({ name, className }: UserAvatarProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <Avatar className={cn("h-8 w-8 text-sm", className)}>
      <AvatarFallback className="bg-primary/20 text-primary font-semibold">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
