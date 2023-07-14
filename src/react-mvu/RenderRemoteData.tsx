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
      return remoteData.placeholder !== undefined ? (
        render(remoteData.placeholder, true)
      ) : (
        <>Loading...</>
      );
    case "notStarted":
      return <></>;
    case "succeeded":
      return render(remoteData.data, false);
    default:
      return unreachable(remoteData);
  }
}

type RenderRemoteDataProps<T> = {
  remoteData: RemoteData<T>;
  render: (data: T, fetching: boolean) => JSX.Element;
};
