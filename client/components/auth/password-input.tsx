"use client";

import { Eye, EyeOff } from "lucide-react";
import * as React from "react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

export function PasswordInput(
  props: Omit<React.ComponentProps<typeof InputGroupInput>, "type">,
) {
  const [visible, setVisible] = React.useState(false);

  return (
    <InputGroup className="h-11">
      <InputGroupInput
        type={visible ? "text" : "password"}
        className="h-full text-base"
        {...props}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-sm"
          aria-label={visible ? "Ukryj hasło" : "Pokaż hasło"}
          aria-pressed={visible}
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? <EyeOff /> : <Eye />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
