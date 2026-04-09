import { AtSign, Mail, Phone } from 'lucide-react';

const DEFAULT_IMAGE_SIZE = 18;

export const OauthProviderLogoImage: React.FC<{
  providerId: string;
  width?: number;
  height?: number;
}> = ({ providerId, width, height }) => {
  const image = getOAuthProviderLogos()[providerId];

  if (typeof image === `string`) {
    return (
      <img
        decoding={'async'}
        loading={'lazy'}
        src={image}
        alt={`${providerId} logo`}
        width={width ?? DEFAULT_IMAGE_SIZE}
        height={height ?? DEFAULT_IMAGE_SIZE}
      />
    );
  }

  return <>{image}</>;
};

function getOAuthProviderLogos(): Record<string, string | React.ReactNode> {
  return {
    password: <AtSign className={'s-[18px]'} />,
    email: <Mail className={'s-[18px]'} />,
    phone: <Phone className={'s-[18px]'} />,
    google: '/images/oauth/google.webp',
    azure: <MicrosoftLogo />,
    twitter: <XLogo />,
  };
}

function MicrosoftLogo() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 21 21"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}

function XLogo() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 300 300"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        className={'fill-secondary-foreground'}
        d="M178.57 127.15 290.27 0h-26.46l-97.03 110.38L89.34 0H0l117.13 166.93L0 300.25h26.46l102.4-116.59 81.8 116.59h89.34M36.01 19.54H76.66l187.13 262.13h-40.66"
      />
    </svg>
  );
}
