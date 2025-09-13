import Image from "next/image";
const Logo = ({width, height, className, onClick}: {width: number, height: number, className?: string, onClick?: (e: React.MouseEvent<HTMLImageElement>) => void}) => {
  return (
    <div>
    <Image src= "next.svg" alt = "Logo" width = {width} height = {height} className={className} onClick={onClick} />
      </div>
  );
};
export default Logo;
