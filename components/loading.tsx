import BarLoader from "react-spinners/BarLoader";
export default function LoadingComp() {
    return(
        <div className={"w-full h-full flex justify-center items-center"}>
            <BarLoader color={"#6e857e"} size={50} />
        </div>
    )
}