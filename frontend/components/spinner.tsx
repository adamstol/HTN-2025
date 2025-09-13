

export default function Spinner() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-foreground border-t-transparent"></div>
      {/* <div className="relative flex justify-center items-center h-14 w-14 mx-auto my-6">
          <div className="absolute inset-0 border-2 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-t-2 border-r-2 border-primary rounded-full animate-spin"></div>
        </div> */}
    </div>
  );
}