import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect } from "react";

export function useSharedSpace(
  myEmail: string, 
  myStats: { minutes: number; song: string; status: string }, 
  setAppTheme: (theme: any) => void
) {
  const spaceData = useQuery(api.study.getSpace, myEmail ? { email: myEmail } : "skip");
  
  const sync = useMutation(api.study.syncStats);
  const addFriendMutation = useMutation(api.study.addFriend);
  const leaveSpaceMutation = useMutation(api.study.leaveSpace);
  const themeMutation = useMutation(api.study.updateTheme);

  useEffect(() => {
    if (myEmail) {
      sync({ ...myStats, email: myEmail });
    }
  }, [myEmail, myStats.minutes, myStats.song, myStats.status]);

  useEffect(() => {
    if (spaceData?.theme) {
      setAppTheme(spaceData.theme);
    }
  }, [spaceData?.theme]);

  // ✅ UPDATED: Accepts Username, sends friendUsername
  const addFriend = async (username: string) => {
    const result = await addFriendMutation({ myEmail, friendUsername: username });
    if (result?.message && !result.success) {
      alert(result.message); // Show error if username not found
    }
  };

  const leaveSpace = () => leaveSpaceMutation({ email: myEmail });
  const syncTheme = (theme: any) => themeMutation({ email: myEmail, ...theme });

  return {
    isLinked: spaceData?.status === "linked",
    partner: spaceData?.partner,
    addFriend,
    leaveSpace,
    syncTheme
  };
}