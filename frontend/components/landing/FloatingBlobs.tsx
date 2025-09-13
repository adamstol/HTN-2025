const FloatingBlobs = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div
        className="floating-blob w-[600px] h-[600px] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"

      />
    </div>
  );
};

export default FloatingBlobs;