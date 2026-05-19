interface Props {
  playerName: string;
}

export const PlayerCoverageHeaderSection = ({ playerName }: Props): JSX.Element => {
  const parts = playerName.trim().split(/\s+/);
  const line1 = parts[0] ?? "";
  const line2 = parts.slice(1).join(" ");

  return (
    <section className="w-full px-4 pt-[39px] pb-4">
      <header className="flex w-full items-center justify-center">
        <h1 className="text-center text-[56px] leading-[0.9] sm:text-[66px] md:text-[76.2px]">
          <span className="[font-family:'Gotham-Medium',Helvetica] font-medium text-[#3d584e] tracking-[-2.33px]">
            {line1.toUpperCase()}
          </span>
          {line2 && (
            <>
              <br />
              <span className="[font-family:'Gotham-Black',Helvetica] font-black text-[#3d584e] tracking-[-2.33px]">
                {line2.toUpperCase()}
              </span>
            </>
          )}
        </h1>
      </header>
    </section>
  );
};
