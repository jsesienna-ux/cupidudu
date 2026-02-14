import { CardArrived } from "./CardArrived";
import { CardWaiting } from "./CardWaiting";

type ProfileCard = {
  id: string;
  full_name?: string | null;
  job?: string | null;
  greeting?: string | null;
  image_url?: string | null;
  age?: number | null;
  mbti?: string | null;
  introduction?: string | null;
};

type DeliveredCardWithProfile = {
  id: string;
  user_id: string;
  status?: string | null;
  manager_comment?: string | null;
  created_at?: string;
  profile: ProfileCard | null;
};

export function DashboardContent({
  card,
  userId,
  initialCoinBalance = 0,
}: {
  card: DeliveredCardWithProfile | null;
  userId?: string;
  initialCoinBalance?: number;
}) {
  if (card?.profile) {
    return (
      <CardArrived
        deliveredCardId={card.id}
        userId={userId ?? ""}
        initialCoinBalance={initialCoinBalance}
        fullName={card.profile.full_name ?? ""}
        job={card.profile.job ?? ""}
        greeting={card.profile.greeting ?? ""}
        imageUrl={card.profile.image_url ?? null}
        managerComment={card.manager_comment ?? null}
        status={card.status ?? "pending"}
        age={card.profile.age ?? null}
        mbti={card.profile.mbti ?? null}
        introduction={card.profile.introduction ?? null}
      />
    );
  }
  return <CardWaiting />;
}
