import {
	CITY_OPTIONS,
	type CityOption,
	STATES,
	type StateOption,
} from "../utils/vendor.location.constant";

export const getCitiesByState = (stateValue?: string | null): CityOption[] =>
	stateValue
		? CITY_OPTIONS.filter((option) => option.state === stateValue)
		: CITY_OPTIONS;

export const getCityOption = (
	stateValue?: string | null,
	cityName?: string | null,
): CityOption | null => {
	if (!cityName) return null;
	const matches = CITY_OPTIONS.filter((option) => option.city === cityName);
	if (!matches.length) return null;
	return stateValue
		? (matches.find((option) => option.state === stateValue) ?? matches[0])
		: matches[0];
};

export const getStateOption = (
	stateValue?: string | null,
): StateOption | null =>
	stateValue
		? (STATES.find((option) => option.value === stateValue) ?? null)
		: null;
