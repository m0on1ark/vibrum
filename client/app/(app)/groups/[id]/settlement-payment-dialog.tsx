"use client";

import { CheckIcon, CopyIcon, InfoIcon, QrCodeIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { InlineError } from "@/components/inline-error";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { encodeQrMatrix } from "@/lib/groups/qr-code";
import {
  formatPolishIban,
  type PaymentDetails,
  type SettlementTransfer,
} from "@/lib/groups/types";
import { formatMoney } from "@/lib/shared/format";

import { getSettlementPaymentDetailsAction } from "./actions";

const QUIET_ZONE_MODULES = 4;

function QrCodeSvg({ payload }: { payload: string }) {
  const qr = useMemo(() => {
    try {
      const matrix = encodeQrMatrix(payload);
      const size = matrix.length;
      const parts: string[] = [];
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (matrix[r][c]) {
            parts.push(
              `M${c + QUIET_ZONE_MODULES} ${r + QUIET_ZONE_MODULES}h1v1h-1z`,
            );
          }
        }
      }
      return { viewSize: size + QUIET_ZONE_MODULES * 2, path: parts.join("") };
    } catch {
      return null;
    }
  }, [payload]);

  if (!qr) return null;

  return (
    <svg
      viewBox={`0 0 ${qr.viewSize} ${qr.viewSize}`}
      shapeRendering="crispEdges"
      role="img"
      aria-label="Kod QR do przelewu bankowego"
      className="size-52 rounded-md border bg-white"
    >
      <rect width={qr.viewSize} height={qr.viewSize} fill="#ffffff" />
      <path d={qr.path} fill="#000000" />
    </svg>
  );
}

export function SettlementPaymentDialog({
  groupId,
  transfer,
}: {
  groupId: number;
  transfer: SettlementTransfer;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<PaymentDetails | null>(null);
  const [copiedField, setCopiedField] = useState<"iban" | "title" | null>(null);
  const requestIdRef = useRef(0);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  async function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) return;

    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    setDetails(null);
    setCopiedField(null);

    const result = await getSettlementPaymentDetailsAction(
      groupId,
      transfer.toUserId,
    );
    if (requestIdRef.current !== requestId) return;

    setLoading(false);
    if (result.error || !result.data) {
      setError(result.error ?? "Nie udało się pobrać danych przelewu.");
      return;
    }
    setDetails(result.data);
  }

  async function handleCopy(field: "iban" | "title", value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Clipboard API may be unavailable outside secure contexts.
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <QrCodeIcon className="size-4" />
          Dane przelewu / QR
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dane do przelewu</DialogTitle>
          <DialogDescription>
            Rozliczenie z użytkownikiem {transfer.toDisplayName}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="grid gap-3 py-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="mx-auto size-52" />
          </div>
        ) : error ? (
          <InlineError message={error} />
        ) : details ? (
          <div className="grid gap-4">
            <dl className="grid gap-3 rounded-lg border bg-muted/30 p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">Odbiorca</dt>
                <dd className="font-medium text-right">
                  {details.recipientName}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-muted-foreground">Kwota</dt>
                <dd className="font-semibold text-right">
                  {formatMoney(details.amount, details.currency)}
                </dd>
              </div>
              <div className="grid gap-1 border-t pt-2">
                <dt className="text-muted-foreground">Tytuł przelewu</dt>
                <dd className="flex items-center justify-between gap-2">
                  <span className="font-medium break-all">{details.title}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    className="shrink-0"
                    onClick={() => handleCopy("title", details.title)}
                  >
                    {copiedField === "title" ? (
                      <>
                        <CheckIcon className="size-3.5" />
                        Skopiowano
                      </>
                    ) : (
                      <>
                        <CopyIcon className="size-3.5" />
                        Kopiuj
                      </>
                    )}
                  </Button>
                </dd>
              </div>
              {details.iban ? (
                <div className="grid gap-1 border-t pt-2">
                  <dt className="text-muted-foreground">Numer konta (IBAN)</dt>
                  <dd className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-medium break-all">
                      {formatPolishIban(details.iban)}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      className="shrink-0"
                      onClick={() => handleCopy("iban", details.iban ?? "")}
                    >
                      {copiedField === "iban" ? (
                        <>
                          <CheckIcon className="size-3.5" />
                          Skopiowano
                        </>
                      ) : (
                        <>
                          <CopyIcon className="size-3.5" />
                          Kopiuj IBAN
                        </>
                      )}
                    </Button>
                  </dd>
                </div>
              ) : null}
            </dl>

            {details.iban ? (
              details.qrPayload ? (
                <div className="grid justify-items-center gap-2 pt-1">
                  <QrCodeSvg payload={details.qrPayload} />
                  <p className="text-center text-xs text-muted-foreground">
                    Zeskanuj kod QR w aplikacji bankowej (standard ZBP).
                  </p>
                </div>
              ) : (
                <Alert>
                  <InfoIcon />
                  <AlertDescription>
                    Kod QR nie jest dostępny dla przelewów powyżej 9 999,99 zł.
                    Użyj danych do przelewu powyżej.
                  </AlertDescription>
                </Alert>
              )
            ) : (
              <Alert>
                <InfoIcon />
                <AlertDescription>
                  {details.recipientName} nie podał(-a) jeszcze numeru IBAN w
                  swoim profilu, więc nie można wygenerować kodu QR.
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
