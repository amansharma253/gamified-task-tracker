import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import type { GamificationProfile } from "../../domain/gamification/types";
import { defaultGamificationConfig } from "../../domain/gamification/config";

type Props = {
  profile: GamificationProfile;
};

export function GamificationCard({ profile }: Props) {
  const xpPerLevel = defaultGamificationConfig.xpPerLevel;
  const xpIntoLevel = profile.xp % xpPerLevel;
  const levelProgress = Math.round((xpIntoLevel / xpPerLevel) * 100);

  const weeklyPct = Math.min(100, Math.round((profile.weekly.progress / profile.weekly.target) * 100));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Level</span>
            <span className="font-medium">{profile.level}</span>
          </div>
          <Progress value={levelProgress} />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{xpIntoLevel} / {xpPerLevel} XP</span>
            <span>{profile.xp} total</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Weekly challenge</span>
            <span className="font-medium">{profile.weekly.progress} / {profile.weekly.target}</span>
          </div>
          <Progress value={weeklyPct} />
          <div className="text-xs text-muted-foreground">High priority completions this week</div>
        </div>

        <div className="flex items-center justify-between rounded-md border p-3">
          <div className="text-sm">
            <div className="font-medium">Streak</div>
            <div className="text-xs text-muted-foreground">Consecutive days completed</div>
          </div>
          <div className="text-lg font-semibold">{profile.streakDays}d</div>
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium">Badges</div>
          <div className="flex flex-wrap gap-2">
            {profile.badges.length === 0 ? (
              <span className="text-sm text-muted-foreground">No badges yet</span>
            ) : (
              profile.badges.map((b) => (
                <Badge key={b} variant="secondary">
                  {b.replaceAll("_", " ")}
                </Badge>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
