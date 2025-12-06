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
      const reason = window.prompt("Укажите причину (необязательно)");
      payload = { cancel_reason: reason || undefined };
    }
    await action.mutateAsync({ action: actionType, exchangeId, payload });
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
    </div>
  );
};
