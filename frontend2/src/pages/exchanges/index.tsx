import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Clock, ThumbsDown, User, X, Award } from "lucide-react";

import {
  useExchangeAction,
  useExchangesQuery,
} from "@/entities/exchange/model/hooks";
import { type ExchangeActionPayload } from "@/shared/api/exchanges";
import { type Exchange } from "@/entities/exchange/model/types";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Spinner } from "@/shared/ui/spinner";

const statusMeta: Record<
  Exchange["progress"],
  { text: string; variant: "secondary" | "outline" | "destructive" | "default" }
> = {
  created: { text: "Ожидает", variant: "secondary" },
  accepted: { text: "Принят", variant: "default" },
  declined: { text: "Отклонён", variant: "destructive" },
  finished: { text: "Завершён", variant: "default" },
  canceled: { text: "Отменён", variant: "outline" },
};

const ExchangeCard = ({
  exchange,
  type,
  onAction,
}: {
  exchange: Exchange;
  type: "owned" | "requested";
  onAction: (
    action: "accept" | "decline" | "cancel" | "finish",
    exchangeId: number,
  ) => void;
}) => {
  const partner = type === "owned" ? exchange.requester : exchange.owner;

  return (
    <Card className="flex gap-4 p-4">
      <img
        src={
          exchange.book.photoUrls[0] ||
          "https://placehold.co/200x300?text=No+Image"
        }
        alt={exchange.book.title}
        className="h-36 w-24 rounded-lg object-cover"
      />
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold">{exchange.book.title}</p>
            <p className="text-sm text-muted-foreground">
              {exchange.book.author.name}
            </p>
          </div>
          <Badge variant={statusMeta[exchange.progress].variant}>
            {statusMeta[exchange.progress].text}
          </Badge>
        </div>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="size-4" />
          {type === "owned" ? "От" : "С"}: {partner.username}
        </p>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="size-4" />
          {new Date(exchange.createdAt).toLocaleDateString()}
        </p>

        <div className="mt-auto flex flex-wrap gap-2">
          {exchange.progress === "created" && type === "owned" && (
            <>
              <Button
                size="sm"
                onClick={() => onAction("accept", exchange.id)}
                className="gap-2"
              >
                <Check className="size-4" /> Принять
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAction("decline", exchange.id)}
                className="gap-2"
              >
                <X className="size-4" /> Отклонить
              </Button>
            </>
          )}
          {exchange.progress === "created" && type === "requested" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAction("cancel", exchange.id)}
            >
              Отменить запрос
            </Button>
          )}
          {exchange.progress === "accepted" && (
            <>
              <Button
                size="sm"
                onClick={() => onAction("finish", exchange.id)}
                className="gap-2"
              >
                <Award className="size-4" /> Завершить
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAction("cancel", exchange.id)}
              >
                Отменить
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

export const ExchangesPage = () => {
  const [tab, setTab] = useState<"owned" | "requested">("owned");
  const [reasonModal, setReasonModal] = useState<{
    open: boolean;
    exchangeId: number | null;
    action: "decline" | "cancel" | null;
  }>({ open: false, exchangeId: null, action: null });
  const [reasonText, setReasonText] = useState("");
  const navigate = useNavigate();
  const { data: exchanges = [], isPending, error, refetch } =
    useExchangesQuery(tab);
  const action = useExchangeAction();

  const handleAction = async (
    actionType: "accept" | "decline" | "cancel" | "finish",
    exchangeId: number,
  ) => {
    let payload: ExchangeActionPayload | undefined;
    if (actionType === "decline" || actionType === "cancel") {
      setReasonModal({ open: true, exchangeId, action: actionType });
      setReasonText("");
      return;
    }
    await action.mutateAsync({ action: actionType, exchangeId, payload });
    refetch();
  };

  const submitReason = async () => {
    if (!reasonModal.exchangeId || !reasonModal.action) return;
    const payload: ExchangeActionPayload = {
      cancel_reason: reasonText.trim() || undefined,
    };
    await action.mutateAsync({
      action: reasonModal.action,
      exchangeId: reasonModal.exchangeId,
      payload,
    });
    setReasonModal({ open: false, exchangeId: null, action: null });
    setReasonText("");
    refetch();
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="size-4" /> Назад
        </Button>
        <h1 className="text-2xl font-bold">Мои обмены</h1>
      </div>

      <div className="flex gap-2 border-b">
        <button
          type="button"
          className={`border-b-2 px-4 py-2 text-sm font-semibold ${
            tab === "owned"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground"
          }`}
          onClick={() => setTab("owned")}
        >
          Мне предлагают
        </button>
        <button
          type="button"
          className={`border-b-2 px-4 py-2 text-sm font-semibold ${
            tab === "requested"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground"
          }`}
          onClick={() => setTab("requested")}
        >
          Мои запросы
        </button>
      </div>

      {isPending && (
        <div className="flex items-center justify-center py-10">
          <Spinner />
        </div>
      )}

      {error && (
        <Card className="p-6 text-center text-destructive">
          Не удалось загрузить обмены
        </Card>
      )}

      {!isPending && !error && exchanges.length === 0 && (
        <Card className="p-8 text-center space-y-2">
          <ThumbsDown className="mx-auto size-8 text-muted-foreground" />
          <p className="font-semibold">Пока нет обменов</p>
          <p className="text-sm text-muted-foreground">
            {tab === "owned"
              ? "Вам еще не предлагали обмен."
              : "Вы еще не запросили обмены."}
          </p>
        </Card>
      )}

      {!isPending && !error && exchanges.length > 0 && (
        <div className="space-y-3">
          {exchanges.map((exchange) => (
            <ExchangeCard
              key={exchange.id}
              exchange={exchange}
              type={tab}
              onAction={handleAction}
            />
          ))}
        </div>
      )}

      {reasonModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-lg bg-card p-6 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {reasonModal.action === "decline" ? "Причина отказа" : "Причина отмены"}
              </h3>
              <button
                type="button"
                onClick={() =>
                  setReasonModal({ open: false, exchangeId: null, action: null })
                }
                className="text-muted-foreground"
              >
                <X className="size-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Укажите причину (необязательно). Она будет отправлена второй стороне.
            </p>
            <textarea
              className="w-full rounded-md border border-border/70 bg-background px-3 py-2 text-sm"
              rows={4}
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              placeholder="Например: не смогу встретиться, передумал"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() =>
                  setReasonModal({ open: false, exchangeId: null, action: null })
                }
              >
                Отмена
              </Button>
              <Button
                onClick={submitReason}
                disabled={action.isPending}
              >
                Отправить
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
