import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function PageWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div
        className="flex-1 flex flex-col"
        style={{ marginLeft: "224px" }}
      >
        <TopBar />
        <main
          className="flex-1 p-6"
          style={{ paddingTop: "calc(48px + 24px)" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}