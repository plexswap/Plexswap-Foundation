import { useTranslation } from "@plexswap/localization";
import {
  AlpIcon,
  AutoRenewIcon,
  BinanceChainIcon,
  BlockIcon,
  CheckmarkCircleIcon,
  CommunityIcon,
  CurrencyIcon,
  LockIcon,
  RefreshIcon,
  RocketIcon,
  Tag,
  TagProps,
  TimerIcon,
  TooltipText,
  VerifiedIcon,
  VoteIcon,
  useTooltip
} from '@plexswap/ui-plex';

import type { FeeAmount } from "@plexswap/sdk-extended";
import React, { memo } from "react";

const CoreTag: React.FC<React.PropsWithChildren<TagProps>> = (props) => {
  const { t } = useTranslation();
  return (
    <Tag
      variant="secondary"
      style={{ background: "none", width: "fit-content" }}
      outline
      startIcon={<VerifiedIcon width="18px" color="secondary" mr="4px" />}
      {...props}
    >
      {t("Core")}
    </Tag>
  );
};

const StableFarmTag: React.FC<React.PropsWithChildren<TagProps>> = (props) => {
  const { t } = useTranslation();
  const { targetRef, tooltip, tooltipVisible } = useTooltip("Fees are lower for stable LP", { placement: "top" });
  return (
    <>
      {tooltipVisible && tooltip}
      <TooltipText
        ref={targetRef}
        display="flex"
        style={{ textDecoration: "none", justifyContent: "center", alignSelf: "center" }}
      >
        <Tag variant="failure" outline startIcon={<CurrencyIcon width="18px" color="failure" mr="4px" />} {...props}>
          {t("Stable LP")}
        </Tag>
      </TooltipText>
    </>
  );
};

const CommunityTag: React.FC<React.PropsWithChildren<TagProps>> = (props) => {
  const { t } = useTranslation();
  return (
    <Tag variant="failure" outline startIcon={<CommunityIcon width="18px" color="failure" mr="4px" />} {...props}>
      {t("Community")}
    </Tag>
  );
};

const DualTag: React.FC<React.PropsWithChildren<TagProps>> = (props) => {
  const { t } = useTranslation();
  return (
    <Tag variant="textSubtle" outline {...props}>
      {t("Dual")}
    </Tag>
  );
};

const ManualPoolTag: React.FC<React.PropsWithChildren<TagProps>> = (props) => {
  const { t } = useTranslation();
  return (
    <Tag variant="secondary" outline startIcon={<RefreshIcon width="18px" color="secondary" mr="4px" />} {...props}>
      {t("Manual")}
    </Tag>
  );
};

const LockedOrAutoPoolTag: React.FC<React.PropsWithChildren<TagProps>> = (props) => {
  const { t } = useTranslation();
  return (
    <Tag variant="success" outline {...props}>
      {t("Auto")}/{t("Locked")}
    </Tag>
  );
};

const LockedPoolTag: React.FC<React.PropsWithChildren<TagProps>> = (props) => {
  const { t } = useTranslation();
  return (
    <Tag variant="success" outline startIcon={<LockIcon width="18px" color="success" mr="4px" />} {...props}>
      {t("Locked")}
    </Tag>
  );
};

const CompoundingPoolTag: React.FC<React.PropsWithChildren<TagProps>> = (props) => {
  const { t } = useTranslation();
  return (
    <Tag variant="success" outline startIcon={<AutoRenewIcon width="18px" color="success" mr="4px" />} {...props}>
      {t("Auto")}
    </Tag>
  );
};

const VoteNowTag: React.FC<React.PropsWithChildren<TagProps>> = (props) => {
  const { t } = useTranslation();
  return (
    <Tag variant="success" startIcon={<VoteIcon width="18px" color="white" mr="4px" />} {...props}>
      {t("Vote Now")}
    </Tag>
  );
};

const VotedTag: React.FC<React.PropsWithChildren<TagProps>> = (props) => {
  const { t } = useTranslation();
  return (
    <Tag
      variant="success"
      style={{ background: "none" }}
      outline
      startIcon={<CheckmarkCircleIcon width="18px" color="success" mr="4px" />}
      {...props}
    >
      {t("Voted")}
    </Tag>
  );
};

const SoonTag: React.FC<React.PropsWithChildren<TagProps>> = (props) => {
  const { t } = useTranslation();
  return (
    <Tag variant="binance" startIcon={<TimerIcon width="18px" color="white" mr="4px" />} {...props}>
      {t("Soon")}
    </Tag>
  );
};

const ClosedTag: React.FC<React.PropsWithChildren<TagProps>> = (props) => {
  const { t } = useTranslation();
  return (
    <Tag variant="textDisabled" startIcon={<BlockIcon width="18px" color="white" mr="4px" />} {...props}>
      {t("Closed")}
    </Tag>
  );
};

const BoostedTag: React.FC<React.PropsWithChildren<TagProps>> = (props) => {
  const { t } = useTranslation();
  return (
    <Tag variant="success" outline startIcon={<RocketIcon width="18px" color="success" mr="4px" />} {...props}>
      {t("Boosted")}
    </Tag>
  );
};

const BscTag: React.FC<React.PropsWithChildren<TagProps>> = (props) => {
  return (
    <Tag style={{ background: "#08060B" }} startIcon={<BinanceChainIcon width="18px" mr="4px" />} {...props}>
      BNB
    </Tag>
  );
};

const ExtendedTag: React.FC<TagProps> = (props) => (
  <Tag variant="secondary" {...props}>
    EXTENDED
  </Tag>
);

const ExtendedFeeTag: React.FC<TagProps & { feeAmount?: FeeAmount }> = ({ feeAmount, ...props }) =>
  feeAmount ? (
    <Tag variant="secondary" outline {...props}>
      {feeAmount / 10_000}%
    </Tag>
  ) : null;

const AlpBoostedTag: React.FC<React.PropsWithChildren<TagProps>> = (props) => {
  const { t } = useTranslation();
  return (
    <Tag outline {...props} variant="secondary" startIcon={<AlpIcon width="18px" color="#4B3CFF" m="-3px 3px 0 0" />}>
      {t("Boosted")}
    </Tag>
  );
};

const Tags = {
  CoreTag,
  DualTag,
  ManualPoolTag,
  CompoundingPoolTag,
  VoteNowTag,
  SoonTag,
  ClosedTag,
  CommunityTag,
  StableFarmTag,
  LockedPoolTag,
  LockedOrAutoPoolTag,
  BoostedTag,
  VotedTag,
  ExtendedFeeTag,
  ExtendedTag,
  BscTag,
  AlpBoostedTag,
};

export default Tags;