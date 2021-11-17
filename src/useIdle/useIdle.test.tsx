import { renderHook } from "@testing-library/react-hooks";
import { fireEvent, render, act } from '@testing-library/react';

import useIdle, { DEFAULT_IDLE_TIME, DEFAULT_THROTTLE_TIME} from './useIdle';

const getSubject = (onIdle: () => void, onResume: () => void) => {
  const Element = () => {
    const { isIdle } = useIdle({ onIdle, onResume });
    const isIdleValue = isIdle.toString();
    return (
      <>
        <div data-testid="idle-state">{isIdleValue}</div>
      </>
    );
  };

  return <Element />;
};

const setup = (onIdle: () => void, onResume: () => void) => render(getSubject(onIdle, onResume));

describe('useIdle', () => {
  let onIdle: jest.Mock<any, any>;
  let onResume: jest.Mock<any, any>;

  beforeEach(() => {
    onIdle = jest.fn();
    onResume = jest.fn();
  });

  afterEach(() => {
    onIdle.mockRestore();
    onResume.mockRestore();
  });

  it('calls onIdle', () => {
    renderHook(() => useIdle({ onIdle, onResume }));
    expect(onIdle).toBeCalled();
    expect(onResume).not.toBeCalled();
  });

  it('does not calls onIdle if disabled', () => {
    renderHook(() => useIdle({ onIdle, enabled: false }));
    expect(onIdle).not.toBeCalled();
  });

  it('does show correct initial state', () => {
    const { getByTestId } = setup(onIdle, onResume);
    expect(getByTestId('idle-state')).toHaveTextContent('true');
  });

  it('does update isIdle state correctly, x/y mousemove', async () => {
    const { getByTestId } = setup(onIdle, onResume);
    expect(getByTestId('idle-state')).toHaveTextContent('true');
    await act(
      async () =>
        new Promise((resolve) => setTimeout(resolve, DEFAULT_THROTTLE_TIME))
    );
    fireEvent.mouseMove(getByTestId('idle-state'), {
      clientX: 250,
      clientY: 20,
    });
    expect(getByTestId('idle-state')).toHaveTextContent('false');
    await act(
      async () =>
        new Promise((resolve) => setTimeout(resolve, DEFAULT_IDLE_TIME))
    );
    expect(getByTestId('idle-state')).toHaveTextContent('true');
  });

  it('does update isIdle state correctly, y mousemove', async () => {
    const { getByTestId } = setup(onIdle, onResume);
    expect(getByTestId('idle-state')).toHaveTextContent('true');
    expect(onResume).not.toHaveBeenCalled();
    await act(
      async () =>
        new Promise((resolve) => setTimeout(resolve, DEFAULT_THROTTLE_TIME))
    );
    fireEvent.mouseMove(getByTestId('idle-state'), { clientX: 0, clientY: 20 });
    expect(getByTestId('idle-state')).toHaveTextContent('false');
    expect(onResume).toHaveBeenCalled();
  });

  it('does update isIdle state correctly, no mousemove', async () => {
    const { getByTestId } = setup(onIdle, onResume);
    expect(getByTestId('idle-state')).toHaveTextContent('true');
    expect(onResume).not.toHaveBeenCalled();
    await act(
      async () =>
        new Promise((resolve) => setTimeout(resolve, DEFAULT_THROTTLE_TIME))
    );
    fireEvent.mouseMove(getByTestId('idle-state'), { clientX: 0, clientY: 0 });
    expect(getByTestId('idle-state')).toHaveTextContent('true');
    expect(onResume).not.toHaveBeenCalled();
  });

  it('does update isIdle state correctly, keydown', async () => {
    const { getByTestId } = setup(onIdle, onResume);
    expect(getByTestId('idle-state')).toHaveTextContent('true');
    expect(onResume).not.toHaveBeenCalled();
    fireEvent.keyDown(getByTestId('idle-state'));
    expect(getByTestId('idle-state')).toHaveTextContent('false');
    expect(onResume).toHaveBeenCalled();
  });

  it('does throttle mousemove event', async () => {
    const { getByTestId } = setup(onIdle, onResume);
    expect(getByTestId('idle-state')).toHaveTextContent('true');
    expect(onResume).not.toHaveBeenCalled();
    await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
    fireEvent.mouseMove(getByTestId('idle-state'), {
      clientX: 250,
      clientY: 20,
    });
    expect(getByTestId('idle-state')).toHaveTextContent('true');
    expect(onResume).not.toHaveBeenCalled();
  });
});
