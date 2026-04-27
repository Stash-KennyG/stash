import React from "react";
import { IntlShape, useIntl } from "react-intl";
import { faRibbon } from "@fortawesome/free-solid-svg-icons";
import TextUtils from "src/utils/text";
import { Icon } from "./Icon";
import { useConfigurationContext } from "src/hooks/Config";

interface IAgeInfoInput {
  birthdate?: string | null;
  deathDate?: string | null;
  sceneDate?: string | null;
}

export interface IAgeInfoResult {
  message?: string;
  isDeceased: boolean;
}

const isDeathBeforeScene = (deathDate: string, sceneDate: string) => {
  const death = TextUtils.stringToFuzzyDate(deathDate);
  const scene = TextUtils.stringToFuzzyDate(sceneDate);
  if (!death || !scene) {
    return false;
  }

  return death < scene;
};

const formatAgeInfo = (
  { birthdate, deathDate, sceneDate }: IAgeInfoInput,
  intl: IntlShape,
  showDeceasedAgeInfo: boolean
): IAgeInfoResult => {
  const yearsOld = intl.formatMessage({ id: "years_old" });
  const aliveMessageId = sceneDate
    ? "media_info.performer_card.age_context"
    : "media_info.performer_card.age";

  // Standard age flow: use normal age message IDs and cap age at death.
  if (!showDeceasedAgeInfo) {
    if (!birthdate) {
      return { isDeceased: false };
    }

    const capAtDeath =
      deathDate !== undefined &&
      deathDate !== null &&
      (!sceneDate || !isDeathBeforeScene(deathDate, sceneDate));

    const age = TextUtils.age(
      birthdate,
      capAtDeath ? deathDate : sceneDate ?? undefined
    );

    return {
      isDeceased: false,
      message: intl.formatMessage(
        { id: aliveMessageId },
        { age: Math.max(0, age), years_old: yearsOld }
      ),
    };
  }

  if (!birthdate && !deathDate) {
    return { isDeceased: false };
  }

  if (!deathDate) {
    if (!birthdate) {
      return { isDeceased: false };
    }

    const age = TextUtils.age(birthdate, sceneDate);
    return {
      isDeceased: false,
      message: intl.formatMessage(
        { id: aliveMessageId },
        { age: Math.max(0, age), years_old: yearsOld }
      ),
    };
  }

  if (sceneDate) {
    if (!isDeathBeforeScene(deathDate, sceneDate)) {
      if (!birthdate) {
        const years = TextUtils.age(deathDate);
        return {
          isDeceased: true,
          message: intl.formatMessage(
            { id: "media_info.performer_card.deceased_years_ago" },
            { years: Math.max(0, years) }
          ),
        };
      }

      const ageAtProduction = TextUtils.age(birthdate, sceneDate);
      const yearsOldLabel = intl.formatMessage({ id: "years_old" });
      return {
        isDeceased: true,
        message: intl.formatMessage(
          { id: "media_info.performer_card.age_context" },
          { age: Math.max(0, ageAtProduction), years_old: yearsOldLabel }
        ),
      };
    }

    if (!birthdate) {
      return { isDeceased: false };
    }

    const years = TextUtils.age(deathDate, sceneDate);
    const age = TextUtils.age(birthdate, deathDate);
    return {
      isDeceased: true,
      message: intl.formatMessage(
        { id: "media_info.performer_card.deceased_years_ago_at_age" },
        { years: Math.max(0, years), age: Math.max(0, age) }
      ),
    };
  }

  if (!birthdate) {
    const years = TextUtils.age(deathDate);
    return {
      isDeceased: true,
      message: intl.formatMessage(
        { id: "media_info.performer_card.deceased_years_ago" },
        { years: Math.max(0, years) }
      ),
    };
  }

  const years = TextUtils.age(deathDate);
  const age = TextUtils.age(birthdate, deathDate);
  return {
    isDeceased: true,
    message: intl.formatMessage(
      { id: "media_info.performer_card.deceased_years_ago_at_age" },
      { years: Math.max(0, years), age: Math.max(0, age) }
    ),
  };
};

export const useAgeInfoFormatter = () => {
  const intl = useIntl();
  const { configuration } = useConfigurationContext();
  const showDeceasedAgeInfo = configuration.ui.showDeceasedAgeInfo ?? true;
  return (input: IAgeInfoInput): IAgeInfoResult =>
    formatAgeInfo(input, intl, showDeceasedAgeInfo);
};

export const useAgeInfo = (input: IAgeInfoInput): IAgeInfoResult => {
  const getAgeInfo = useAgeInfoFormatter();
  return getAgeInfo(input);
};

interface IAgeInfoDisplayProps extends IAgeInfoInput {
  ageInfo?: IAgeInfoResult;
  className?: string;
  as?: "span" | "div";
}

export const AgeInfoDisplay: React.FC<IAgeInfoDisplayProps> = ({
  birthdate,
  deathDate,
  sceneDate,
  ageInfo,
  className,
  as = "span",
}) => {
  const computedAgeInfo = useAgeInfo({ birthdate, deathDate, sceneDate });
  const resolvedAgeInfo = ageInfo ?? computedAgeInfo;

  if (!resolvedAgeInfo.message) {
    return null;
  }

  const Component = as;
  const resolvedClassName = resolvedAgeInfo.isDeceased
    ? `d-inline-flex align-items-center ${className ?? ""}`.trim()
    : className;

  return (
    <Component className={resolvedClassName}>
      {resolvedAgeInfo.isDeceased && (
        <Icon icon={faRibbon} className="performer-age-deceased-icon mx-0 mr-1" />
      )}
      <span>{resolvedAgeInfo.message}</span>
    </Component>
  );
};
