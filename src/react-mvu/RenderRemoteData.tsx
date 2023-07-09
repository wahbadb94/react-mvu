import { RemoteData } from "./RemoteData";
import { unreachable } from "../utilities/matcher";

export default function RenderRemoteData<T>({
  remoteData,
  render,
}: RenderRemoteDataProps<T>): JSX.Element {
  switch (remoteData.tag) {
    case "failed":
      return <>Something went wrong</>;
    case "inProgress":
      return <>Loading...</>;
    case "notStarted":
      return <></>;
    case "succeeded":
      return render(remoteData.data);
    default:
      return unreachable(remoteData);
  }
}

type RenderRemoteDataProps<T> = {
  remoteData: RemoteData<T>;
  render: (data: T) => JSX.Element;
};
