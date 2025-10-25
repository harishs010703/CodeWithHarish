import { useParams } from "react-router-dom";
import CodeEditor from "./CodeEditor";

const Room = () => {
  const { sessionId, name } = useParams<{ sessionId: string; name: string }>();

  return (
    <div>
      
      <CodeEditor sessionId={sessionId || "default"} userName={name || "Anonymous"} />
    </div>
  );
};

export default Room;
